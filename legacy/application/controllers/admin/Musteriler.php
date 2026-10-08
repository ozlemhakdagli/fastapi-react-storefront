<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Musteriler extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->helper('url');
		$this->load->database();
		$this->load->library('session');
		$this->load->model('Database_Model');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	{	$data["veriler"]=$this->Database_Model->urunler_get();	
		$query=$this->db->get("musteriler");
		$data["veri"]=$query->result();
		$data['sayfa']='Müşteriler';
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/musteriler_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function edit($id)
	
	{	$data['sayfa']='Müşteri Düzenle';
	$data["veriler"]=$this->Database_Model->urunler_get();
		$sorgu=$this->db->query("SELECT * FROM musteriler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');	
		$this->load->view('admin/musteriler_duzenle',$data);
		$this->load->view('admin/footer');
			
	
		
		
	}
	public function guncellekaydet($id)
	{		
		$data=array(
			'AdiSoyadi'  => $this->input->post('AdiSoyadi'),
			'email' => $this->input->post('email'),
			'sifre' => $this->input->post('sifre'),
			'adres' => $this->input->post('adres'),
			'yetki' => $this->input->post('yetki'),
			'tel' => $this->input->post('tel'),
			'durum' => $this->input->post('durum')
		
			);
			$this->Database_Model->update_data("musteriler",$data,$id);
			$this->session->set_flashdata('sonuc','Güncelleme işlemi başarılıdır!');
			redirect (base_url()."/admin/musteriler");
			
		
		
	}

	public function delete($id)
	{		
		$this->db->query("DELETE FROM musteriler WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."/admin/musteriler");
			
		
		
	}
	public function preview($id)
	{	$data['sayfa']='Müşteri Görüntüle';
		$data["veriler"]=$this->Database_Model->urunler_get();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$sorgu=$this->db->query("SELECT * FROM musteriler WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/musteri_goster',$data);
		$this->load->view('admin/footer');
			
	}
}
