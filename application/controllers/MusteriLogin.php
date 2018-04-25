<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MusteriLogin extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		
		$this->load->library("session");
		$this->load->helper('url');
		$this->load->library('form_validation');
		$this->load->model("Musteri_Model");
		$this->load->model("Database_Model");
		$this->load->database();
		
	} 

	public function index()
	{
		$this->load->view('login_formu');
	
	}
	public function login_ol()
	{	
	
		$email = $this->input->post('email',TRUE);
		$sifre = $this->input->post('sifre',TRUE);
		// zararlı kodlardan temizleme
		$email = $this->security->xss_clean($email);
		$sifre = $this->security->xss_clean($sifre);
	
		
		$result = $this->Musteri_Model->login($email,$sifre);
		
			if($result)
				{
					
					$uye_session = array(
					'id' => $result[0]->Id,
					'yetki' =>$result[0]->yetki,
					'email' =>$result[0]->email,
					'adsoy'=>$result[0]->AdiSoyadi,
					'durum' =>$result[0]->durum,
					'tarih' =>$result[0]->tarih,
					'aciklama'=>$result[0]->aciklama,
					'adres' =>$result[0]->adres,
					'tel' =>$result[0]->tel,
					'sifre'=>$result[0]->sifre
	
					
					);
				
					$this->session->set_userdata('uye_oturum',$uye_session);
					
					redirect(base_url().'home');
					
				}
			else
				{
					$this->session->set_flashdata("login_hata", "Geçersiz Email yada şifre");
					$this->load->view('login_formu');
		
				}
		
		
	}
	public function log_out()
	{
		$this->session->unset_userdata('oturum_data');
		$this->session->sess_destroy();
		redirect(base_url().'home');
	}
	public function yeni_uye()
	{
		
		
		$this->load->view('yeniuyelogin_formu');
	}
	public function yeniuye_ol()
	{
		$data=array(
			'AdiSoyadi' => $this->input->post('AdiSoyadi'),
			'email' => $this->input->post('email'),
			'sifre' => $this->input->post('sifre'),
			'adres' => $this->input->post('adres'),
			
			'tel' => $this->input->post('tel')
			
			);
			$this->Database_Model->insert_data("musteriler",$data);
			
			redirect (base_url().MusteriLogin);
	}
	public function uye_guncelle()
	{
		
		$id= $this->session->uye_oturum["id"];
		
		$data=array(
			'AdiSoyadi' => $this->input->post('AdiSoyadi'),
			
			'sifre' => $this->input->post('sifre'),
			'adres' => $this->input->post('adres'),
			'tel' => $this->input->post('tel'),
			
			
			);
			$this->Database_Model->update_data("musteriler",$data,$id);
			
			redirect (base_url().'home/uyepanel/');
	}
	
}
	