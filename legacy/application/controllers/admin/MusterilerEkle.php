<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MusterilerEkle extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
		
		$this->load->helper('url');
		$this->load->library('session');
		$this->load->database();
		$this->load->model('Database_Model');
	} 
	public function index()
	{	
		$query=$this->db->get("sehir");
		$data["veriler"]=$query->result();
		$data['sayfa']='Müşteri Ekle';
		$query=$this->db->get("musteriler");
		$data["veri"]=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/musteri_ekle');
		$this->load->view('admin/footer');
		
		
	}
	public function kaydet()
	{		
		$data=array(
			'adiSoyadi'   => $this->input->post('adiSoyadi'),
			'email' => $this->input->post('email'),
			'sifre' => $this->input->post('sifre'),
			'tel' =>$this->input->post('tel'),
			'sehir_id' => $this->input->post('sehir_id'),
			'adres' =>$this->input->post('adres'),
			'yetki' => $this->input->post('yetki'),
			'durum' => $this->input->post('durum')
			
			);
			$this->Database_Model->insert_data("musteriler",$data);
			$this->session->set_flashdata('sonuc','Müşteri ekleme işlemi başarılıdır!');
			redirect (base_url()."/admin/musteriler");
			
		
		
	}
	
}
